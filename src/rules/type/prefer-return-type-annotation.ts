import type { TSESTree } from '@typescript-eslint/types'
import { closest, isFunctionLike, isAwait, isIdentifierName } from '../../node.js'
import { createRule } from '../../rule.js'
import { wrap } from '../../utils.js'
import { getReturnExpression } from './../no-redundant-variable.js'

export default createRule({
  name: 'type/prefer-return-type-annotation',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Enforce Move return type annotation to function return type',
      recommended: 'stylistic',
    },
    schema: [],
    messages: {
      'move-type': 'Move return type annotation to return type',
    },
  },
  create(context) {
    const source = context.sourceCode
    return {
      ReturnStatement(node) {
        const { argument } = node
        const parent = closest(node, isFunctionLike)
        if (!parent || !isAs(argument)) return
        if (isAsConstType(argument.typeAnnotation)) return
        context.report({
          node: argument.typeAnnotation,
          messageId: 'move-type',
          *fix(fixer) {
            const annotation = wrap(source.getText(argument.typeAnnotation), (annotation) => {
              if (annotation.startsWith('Promise')) return annotation
              return parent.async || isAwait(argument.expression) ? `Promise<${annotation}>` : annotation
            })
            if (parent.returnType) {
              yield fixer.insertTextAfter(parent.returnType, ` | ${annotation}`)
            } else {
              const offset = parent.type === 'ArrowFunctionExpression' ? 4 : 1
              const range = wrap(parent.body.range, ([start, end]): TSESTree.Range => [start - offset, end])
              yield fixer.insertTextBeforeRange(range, `: ${annotation}`)
            }
            yield isAwait(argument.expression)
              ? fixer.replaceText(argument, source.getText(getReturnExpression(argument.expression)))
              : fixer.removeRange(wrap(argument.typeAnnotation.range, ([start, end]) => [start - 4, end]))
          },
        })
      },
    }
  },
})

function isAs(node?: TSESTree.Node | null): node is TSESTree.TSAsExpression {
  return node?.type === 'TSAsExpression'
}

function isAsConstType(node: TSESTree.TypeNode) {
  return node?.type === 'TSTypeReference' && isIdentifierName(node.typeName, 'const')
}
