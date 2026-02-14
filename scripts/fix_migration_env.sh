#!/bin/sh

echo "Fixing dependencies..."
npm install --force

echo "Verifying Prisma version..."
npx prisma -v

echo "If the version above says 5.x, you can now run: npx prisma migrate dev"
