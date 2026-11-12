#!/bin/sh
# Aplica las migraciones pendientes y arranca la API.
# `migrate deploy` solo aplica migraciones ya creadas (nunca genera ni resetea), así que es seguro en producción.
set -e
./node_modules/.bin/prisma migrate deploy
exec node dist/src/main.js
