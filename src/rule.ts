import type { ParserServices, ParserServicesWithTypeInformation } from '@typescript-eslint/utils'
import type { RuleContext, RuleListener, RuleMetaData } from '@typescript-eslint/utils/ts-eslint'

const BASE_URL = 'https://dimensiondev.github.io/eslint-plugin/src/rules/'

interface Metadata<TMessageIDs extends string, TOptions extends readonly unknown[]>
  extends RuleMetaData<TMessageIDs, TOptions> {
  hidden?: boolean
}

export interface RuleModule<
  TResolvedOptions,
  TOptions extends readonly unknown[],
  TMessageIDs extends string,
  TRuleListener extends RuleListener,
> {
  readonly name: string
  readonly meta: Metadata<TMessageIDs, TOptions>
  resolveOptions?(...options: TOptions): TResolvedOptions
  create(context: Readonly<RuleContext<TMessageIDs, TOptions>>, options: TResolvedOptions): TRuleListener
}

export interface ExportedRuleModule<
  TOptions extends readonly unknown[] = unknown[],
  TMessageIDs extends string = string,
  TRuleListener extends RuleListener = RuleListener,
> {
  readonly name: string
  readonly meta: Metadata<TMessageIDs, TOptions>
  create(context: Readonly<RuleContext<TMessageIDs, TOptions>>): TRuleListener
}
export type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

export function createRule<
  TResolvedOptions,
  TOptions extends unknown[],
  TMessageIDs extends string,
  TRuleListener extends RuleListener = RuleListener,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>({ name, meta, create, resolveOptions }: RuleModule<TResolvedOptions, TOptions, TMessageIDs, TRuleListener>): any {
  if (meta?.docs) {
    meta.docs.url ??= new URL(name, BASE_URL).toString()
  }
  return Object.freeze<ExportedRuleModule<TOptions, TMessageIDs, TRuleListener>>({
    name,
    meta,
    create(context) {
      const options = resolveOptions?.(...context.options) ?? (context.options[0] as TResolvedOptions)
      const listener = Object.entries(create(context, options))
      return Object.fromEntries(listener.filter((pair) => pair[1])) as TRuleListener
    },
  })
}

export function ensureParserWithTypeInformation(
  parserServices: Partial<ParserServices> | undefined,
): asserts parserServices is ParserServicesWithTypeInformation {
  if (!parserServices?.program) {
    throw new Error('see https://typescript-eslint.io/docs/linting/type-linting')
  }
}
