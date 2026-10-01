# @securechat/crypto — Cryptography Module

Core client-side cryptographic library implementing the standard W3C Web Cryptography API (`window.crypto.subtle`) for **WhisperNet**.

## Algorithms & Primitives
- **RSA-OAEP (3072-bit)**: SHA-256 hash, public exponent 65537 for asymmetric key wrapping.
- **AES-256-GCM**: Symmetric authenticated encryption with 96-bit CSPRNG nonces and 128-bit authentication tags.
- **SPKI / PEM Export**: Standard SubjectPublicKeyInfo PEM encoding for public key exchange.
- **JWK Serialization**: JSON Web Key format for client-side private key preservation.

## Testing
Run the standalone crypto test suite:
```bash
node test-crypto.js
```

## License
This project is licensed under the [MIT License](../../LICENSE) - see the root LICENSE file for details.
