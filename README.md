Whisper Box
===========

This is a simple webapp for sharing secret texts, where everyone could submit messages to be encrypted but only selected passphrase holders with predefined schema that could decrypt it.

## Tech stack
- NextJs
- TailwindCSS
- PostgreSQL
- shamir NPM Package
- Web Crypto API

## Getting Started

1. Clone this repo, prepare PostgreSQL database
2. Copy `.env.example` to `.env`, then edit accordingly
3. Run following commands:
```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technical Design
This project utilized symmetric encryption, asymmetric encryption, and shamir secret sharing

1. Asymmetric encryption used so everyone could encrypt messages using public key, and then submit it
2. Shamir secret sharing used to split the private key generated above into several "shards", allowing the messages to be decrypted only if it fullfil the predefined sharing schema
3. symmetric encryption (with authentication) used to encrypt the shards with passwords by each keyholders
