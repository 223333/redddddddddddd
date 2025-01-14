import { rm } from 'fs/promises'
import { resolve } from 'node:path'

void Promise.all(
  [
    '../build',
    '../packages/core/lib',
    '../packages/core/tsconfig.tsbuildinfo',
    '../packages/red/lib',
    '../packages/red/tsconfig.tsbuildinfo',
    '../packages/llqqnt/lib',
    '../packages/qqntim/lib',
  ].map((x) =>
    rm(resolve(__dirname, x), {
      force: true,
      recursive: true,
    }),
  ),
)
