type RouterOptions = {
  body: BodyType
  testType: 'a' | 'b'
}

const defaultRouterOption = {
  body: 'none',
  testType: 'a',
} as const

type BodyType = 'binary' | 'json' | 'text' | 'none'
type RouterHandlerContext<RouterOption extends RouterOptions> = {
  body: RouterOption['body'] extends 'text'
    ? string
    : RouterOption['body'] extends 'json'
    ? unknown
    : RouterOption['body'] extends 'binary'
    ? ArrayBuffer
    : RouterOption['body'] extends 'none'
    ? undefined
    : unknown
  testType: RouterOption['testType']
}
type RouterHandler<RouterOption extends RouterOptions, T> = (
  ctx: RouterHandlerContext<RouterOption>,
) => T | Promise<T>

type RouterOptionsToDeclarator<RouterOption extends RouterOptions> = {
  [key in keyof RouterOptions as `$${string & key}`]: <
    RouterOptionValue extends RouterOptions[key],
  >(
    optionValue: RouterOptionValue,
  ) => RouterProxy<{
    [keyOpt in keyof RouterOptions]: keyOpt extends key
      ? RouterOptionValue & RouterOptions[keyOpt]
      : RouterOption[keyOpt]
  }>
}

type RouterOptionDeclaratorKeys = {
  [key in keyof RouterOptions as `$${string & key}`]: unknown
}

type RouterOptionsDeclarators<RouterOption extends RouterOptions> =
  RouterOptionsToDeclarator<RouterOption>
type RouterProxy<RouterOption extends RouterOptions> = {
  [K in keyof Omit<
    never,
    keyof RouterOptionDeclaratorKeys
  >]: RouterProxy<RouterOption>
} & {
  (handler: RouterHandler<RouterOption, unknown>): undefined
  <T extends Partial<RouterOptions>>(
    handler: RouterHandler<
      {
        [key in keyof RouterOptions]: [T[key]] extends [undefined]
          ? RouterOptions[key]
          : NonNullable<T[key]>
      },
      unknown
    >,
    options: T,
  ): undefined
} & {
  [K in keyof RouterOptionDeclaratorKeys]: RouterOptionsDeclarators<RouterOption>[K]
}

export interface Route {
  path: string[]
  options: RouterOptions
  handler: <T>(ctx: RouterHandler<RouterOptions, T>) => T
}
const routes: Route[] = []

type MakeRouterProxyFn = (
  path: string[],
  options: RouterOptions,
) => RouterProxy<RouterOptions>
const makeRouterProxy: MakeRouterProxyFn = ((
  path: string[],
  options: RouterOptions,
) =>
  new Proxy(() => {}, {
    get(_, prop) {
      if (typeof prop === 'symbol') throw Error('Symbol is not supported')
      if (prop.startsWith('$')) {
        return (optionValue: string) =>
          makeRouterProxy(path, {
            ...options,
            [prop.slice(1)]: optionValue,
          })
      }
      return makeRouterProxy([...path, prop], options)
    },
    set(_, __, ___, ____) {
      throw Error('Cannot set property on router')
    },
    apply(
      _,
      __,
      [handler, applyOptions]: [
        RouterHandler<never, unknown>,
        Partial<RouterOptions>,
      ],
    ) {
      routes.push({
        path,
        options: {
          ...options,
          ...applyOptions,
        },
        handler,
      } as unknown as Route)
    },
  })) as unknown as MakeRouterProxyFn

export const router: RouterProxy<typeof defaultRouterOption> = makeRouterProxy(
  [],
  defaultRouterOption,
) as unknown as RouterProxy<typeof defaultRouterOption>