/* eslint-disable unicorn/no-useless-undefined */
import type { RuleMetaData } from '@typescript-eslint/utils/dist/ts-eslint'
import { compile as toJSONSchema, JSONSchema } from 'json-schema-to-typescript'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { ExportedRuleModule } from '../../src/rule'
import { format, getRuleName, replace, RULE_PATH } from './utils'

export async function generateRuleDetails(modules: ExportedRuleModule[]) {
  for (const module of modules) {
    const documentationPath = path.join(RULE_PATH, `${module.name}.md`)
    if (await exists(documentationPath)) {
      await update(documentationPath, module)
    }
  }
}

async function update(filePath: string, { name, meta }: ExportedRuleModule) {
  let content = await fs.readFile(filePath, 'utf-8')

  content = replace(content, 'title', `# \`${getRuleName(name)}\`\n${meta.docs?.description}`)
  content = replace(content, 'options', await makeOptions(meta))
  content = replace(content, 'attributes', makeAttributes(meta))

  const formatted = await format(content, 'markdown')
  await fs.writeFile(filePath, formatted, 'utf-8')
}

async function exists(filePath: string) {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}

function makeAttributes(meta: RuleMetaData<string>) {
  const attributes = {
    ':white_check_mark: Recommended': meta.docs?.recommended,
    ':wrench: Fixable': meta.fixable,
    ':bulb: Suggestions': meta.hasSuggestions,
    ':gear: Configurable': meta.schema.length > 0,
    ':thought_balloon: Requires type information': meta.docs?.requiresTypeChecking,
  }
  const lines: string[] = []
  for (const [text, value] of Object.entries(attributes)) {
    lines.push(`- [${value ? 'x' : ' '}] ${text}`)
  }
  return lines.join('\n')
}

async function makeOptions(meta: RuleMetaData<string>) {
  const schema: JSONSchema = Array.isArray(meta.schema)
    ? { type: 'array', items: meta.schema, minItems: Number.POSITIVE_INFINITY }
    : meta.schema
  if (!schema) return ''
  const compiled = await toJSONSchema(schema, 'Options', {
    bannerComment: '',
    ignoreMinAndMaxItems: true,
  })
  return `\`\`\`ts\n${compiled}\n\`\`\``
}
