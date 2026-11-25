#!/usr/bin/env bash
# Calcula la siguiente versión de una app a partir de su último tag (<app>-v1.2.3) y de los mensajes de commit
# (Conventional Commits) desde ese tag. Ver "Versiones" en docs/despliegue.md.
#
#   scripts/next-version.sh <app> <carpeta de la app> [rutas compartidas...]
#   scripts/next-version.sh web apps/web package.json pnpm-lock.yaml
#
# Reglas (solo cuentan los commits que tocan la carpeta de la app para decidir el tipo):
#   - Sin tag previo                              → 1.0.0
#   - `tipo!:` o `BREAKING CHANGE:` en el cuerpo   → major
#   - `feat:` / `feat(scope):`                    → minor
#   - Cualquier otro commit en la app o en las rutas compartidas → patch
#   - Ningún commit nuevo (re-ejecución manual)   → misma versión, sin tag nuevo
#
# Imprime líneas `clave=valor` para "$GITHUB_OUTPUT": version, tag, bump, new_tag (true/false).
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Uso: $0 <app> <carpeta> [rutas compartidas...]" >&2
  exit 1
fi

app=$1
dir=$2
shift 2
shared=("$@")
prefix="${app}-v"

last=$(git tag --list "${prefix}[0-9]*" --sort=-v:refname | head -n1)

emit() {
  echo "version=$1"
  echo "tag=${prefix}$1"
  echo "bump=$2"
  echo "new_tag=$3"
}

if [ -z "$last" ]; then
  emit 1.0.0 initial true
  exit 0
fi

current=${last#"$prefix"}
IFS=. read -r major minor patch <<<"$current"
range="${last}..HEAD"

app_subjects=$(git log --format='%s' "$range" -- "$dir")
app_bodies=$(git log --format='%b' "$range" -- "$dir")
shared_commits=""
if [ ${#shared[@]} -gt 0 ]; then
  shared_commits=$(git log --format='%H' "$range" -- "${shared[@]}")
fi

if grep -qE '^[a-z]+(\([^)]*\))?!:' <<<"$app_subjects" || grep -qE '^BREAKING[ -]CHANGE:' <<<"$app_bodies"; then
  emit "$((major + 1)).0.0" major true
elif grep -qE '^feat(\([^)]*\))?:' <<<"$app_subjects"; then
  emit "${major}.$((minor + 1)).0" minor true
elif [ -n "$app_subjects" ] || [ -n "$shared_commits" ]; then
  emit "${major}.${minor}.$((patch + 1))" patch true
else
  emit "$current" none false
fi
