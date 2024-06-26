import type { TSESTree } from '@typescript-eslint/types'
import { createRule } from '../../rule.js'
import { getGlobalScope, quote } from '../../utils.js'

const PRIMITIVE_TYPES = ['BigInt', 'Boolean', 'Function', 'Number', 'Object', 'String', 'Symbol', 'Array']

export default createRule({
  name: 'type/no-instanceof-wrapper',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Disallow `instanceof` for wrapper objects',
      recommended: 'recommended',
    },
    schema: [],
    messages: {
      primitive: 'Unexpected `instanceof` operator. Use `typeof x === "{{typeName}}"` instead',
      array: 'Unexpected `instanceof` operator. Use `Array.isArray` instead',
    },
    replacedBy: ['unicorn/no-instanceof-array'],
  },
  create(context) {
    const source = context.sourceCode
    const globalScope = getGlobalScope(source)
    const references = PRIMITIVE_TYPES.flatMap((name) => {
      const variable = globalScope?.set.get(name)
      if (!variable || variable.defs.length > 0) return []
      return variable.references ?? []
    })
    return {
      Program() {
        for (const { identifier } of references) {
          const node = identifier.parent
          if (!isInstanceOf(node, identifier)) continue
          if (identifier.name === 'Array') {
            context.report({
              node,
              messageId: 'array',
              fix: (fixer) => fixer.replaceText(node, `Array.isArray(${source.getText(node.left)})`),
            })
          } else {
            const typeName = identifier.name.toLowerCase()
            context.report({
              node,
              messageId: 'primitive',
              data: { typeName },
              fix: (fixer) => fixer.replaceText(node, `typeof ${source.getText(node.left)} === ${quote(typeName)}`),
            })
          }
        }
      },
    }
  },
})

function isInstanceOf(node: TSESTree.Node | undefined, identifier: TSESTree.Node): node is TSESTree.BinaryExpression {
  return node?.type === 'BinaryExpression' && node.operator === 'instanceof' && node.right === identifier
}
