import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  generateSigningKeyPair,
  exportSigningPublicKey,
  deriveKeyEncryptionKey,
  encryptVaultItem,
  generateSessionKey,
  encryptSessionKey,
  encryptMessage,
  signPayload,
} from '@securechat/crypto';

const prisma = new PrismaClient();

async function createDemoUser(username: string, email: string, passwordPlain: string) {
  console.log(`Generating cryptographic identity for ${username}...`);
  
  // 1. Password Hash
  const passwordHash = await argon2.hash(passwordPlain, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // 2. RSA-3072 Encryption Keypair
  const rsaPair = await generateRSAKeyPair();
  const publicKeyPem = await exportPublicKey(rsaPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(rsaPair.privateKey);

  // 3. ECDSA P-256 Signing Keypair
  const signPair = await generateSigningKeyPair();
  const signingPublicKeyPem = await exportSigningPublicKey(signPair.publicKey);
  const signingPrivKeyJwk = JSON.stringify(await crypto.subtle.exportKey('jwk', signPair.privateKey));

  // 4. Zero-Knowledge Key Vault (PBKDF2 600,000 rounds)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kek = await deriveKeyEncryptionKey(passwordPlain, salt);
  
  const encPriv = await encryptVaultItem(privateKeyJwk, kek);
  const encSign = await encryptVaultItem(signingPrivKeyJwk, kek);

  // 5. Upsert User in Database
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      publicKey: publicKeyPem,
      encryptedPrivateKey: encPriv.encryptedBlob,
      keySalt: btoa(String.fromCharCode(...salt)),
      keyIv: encPriv.iv,
      signingPublicKey: signingPublicKeyPem,
      encryptedSigningKey: encSign.encryptedBlob,
      signingKeyIv: encSign.iv,
    },
    create: {
      username,
      email,
      passwordHash,
      publicKey: publicKeyPem,
      encryptedPrivateKey: encPriv.encryptedBlob,
      keySalt: btoa(String.fromCharCode(...salt)),
      keyIv: encPriv.iv,
      signingPublicKey: signingPublicKeyPem,
      encryptedSigningKey: encSign.encryptedBlob,
      signingKeyIv: encSign.iv,
    },
  });

  return { user, rsaPair, signPair };
}

async function seed() {
  console.log('🚀 Starting WhisperNet Database Seed...');

  const password = 'SecretPass123!';
  
  const alice = await createDemoUser('Alice', 'alice@whispernet.dev', password);
  console.log(`✅ Seeded Alice (ID: ${alice.user.id})`);

  const bob = await createDemoUser('Bob', 'bob@whispernet.dev', password);
  console.log(`✅ Seeded Bob (ID: ${bob.user.id})`);

  // Create an initial Direct Conversation between Alice and Bob
  console.log('Establishing initial E2EE conversation between Alice and Bob...');
  
  const existingConv = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: alice.user.id } } },
        { members: { some: { userId: bob.user.id } } },
      ],
    },
  });

  let conversationId = existingConv?.id;

  if (!existingConv) {
    // Generate AES-256-GCM Session Key
    const sessionKey = await generateSessionKey();
    const encKeyAlice = await encryptSessionKey(sessionKey, alice.rsaPair.publicKey);
    const encKeyBob = await encryptSessionKey(sessionKey, bob.rsaPair.publicKey);

    const newConv = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: alice.user.id },
            { userId: bob.user.id },
          ],
        },
        sessionKeys: {
          create: {
            keyVersion: 1,
            encryptedKeyMaterial: JSON.stringify({
              [alice.user.id]: encKeyAlice,
              [bob.user.id]: encKeyBob,
            }),
          },
        },
      },
    });

    conversationId = newConv.id;
    console.log(`✅ Created Conversation between Alice and Bob (ID: ${conversationId})`);

    // Add initial welcome messages
    const msg1 = await encryptMessage('Hey Bob! Welcome to WhisperNet. Our conversation is end-to-end encrypted with RSA-3072 and AES-256-GCM.', sessionKey);
    const sig1 = await signPayload(alice.signPair.privateKey, `${conversationId}:${msg1.ciphertext}:${msg1.nonce}`);
    
    await prisma.message.create({
      data: {
        conversationId,
        senderId: alice.user.id,
        ciphertext: msg1.ciphertext,
        nonce: msg1.nonce,
        authTag: '',
        keyVersion: 1,
        signature: sig1,
      },
    });

    const msg2 = await encryptMessage('Awesome Alice! The zero-knowledge vault restored my keys seamlessly across devices.', sessionKey);
    const sig2 = await signPayload(bob.signPair.privateKey, `${conversationId}:${msg2.ciphertext}:${msg2.nonce}`);
    
    await prisma.message.create({
      data: {
        conversationId,
        senderId: bob.user.id,
        ciphertext: msg2.ciphertext,
        nonce: msg2.nonce,
        authTag: '',
        keyVersion: 1,
        signature: sig2,
      },
    });

    console.log('✅ Seeded initial encrypted messages with valid ECDSA digital signatures');
  } else {
    console.log('ℹ️ Conversation between Alice and Bob already exists');
  }

  console.log('🎉 Seeding successfully finished!');
  console.log('Credentials:');
  console.log('  Alice -> alice@whispernet.dev / SecretPass123!');
  console.log('  Bob   -> bob@whispernet.dev   / SecretPass123!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
