class Blueprint<
  ObjectType extends Record<string, any>,
  ResultType extends Record<string, any>,
  IsAsync extends boolean,
  Options extends Record<string, any>
> {
  constructor(
    keptFields: (keyof ObjectType)[],
    fieldGetters: ((obj: ObjectType, options: Options) => Record<string, any>)[],
    asyncFieldGetters: ((obj: ObjectType, options: Options) => Promise<Record<string, any>>)[]
  ) {
    this.__keptFields = keptFields
    this.__fieldGetters = fieldGetters
    this.__asyncFieldGetters = asyncFieldGetters
  }

  render = (
    obj: ObjectType,
    ...options: IsEmptyObject<Options> extends true ? [undefined?] : [Options]
  ): IsAsync extends true ? Promise<ResultType> : ResultType => {
    const keptFieldsFromObject = Object.fromEntries(
      Object.entries(obj).filter((e) => this.__keptFields.includes(e[0] as any))
    )

    const syncFields = this.__fieldGetters.map((g) => g(obj, options[0] || ({} as any)))

    if (this.__asyncFieldGetters.length !== 0) {
      return Promise.all(
        this.__asyncFieldGetters.map((g) => g(obj, options[0] || ({} as any)))
      ).then((asyncFields) => {
        return Object.assign(keptFieldsFromObject, ...syncFields, ...asyncFields)
      }) as any
    } else {
      return Object.assign(keptFieldsFromObject, ...syncFields)
    }
  }

  renderArray = (
    objs: ObjectType[],
    ...options: IsEmptyObject<Options> extends true ? [undefined?] : [Options]
  ): IsAsync extends true ? Promise<ResultType> : ResultType => {
    if (this.__asyncFieldGetters.length !== 0) {
      return Promise.all(objs.map((obj) => this.render(obj, options[0] || ({} as any)))) as any
    } else {
      return objs.map((obj) => this.render(obj, options[0] || ({} as any))) as any
    }
  }

  keepFields = <Field extends keyof ObjectType>(
    fields: Field[]
  ): Blueprint<ObjectType, ResultType & Pick<ObjectType, Field>, IsAsync, Options> => {
    return new Blueprint<ObjectType, ResultType & Pick<ObjectType, Field>, IsAsync, Options>(
      [...this.__keptFields, ...fields],
      this.__fieldGetters,
      this.__asyncFieldGetters
    )
  }

  withFields<NewFields extends Record<string, any>>(
    getter: (obj: ObjectType) => NewFields
  ): Blueprint<ObjectType, ResultType & NewFields, IsAsync, Options>

  withFields<NewFields extends Record<string, any>, NewOptions extends Record<string, any>>(
    getter: (obj: ObjectType, options: NewOptions) => NewFields
  ): Blueprint<ObjectType, ResultType & NewFields, IsAsync, Options & NewOptions>

  withFields<NewFields extends Record<string, any>, NewOptions extends Record<string, any>>(
    getter: (obj: ObjectType, options: NewOptions) => NewFields
  ): Blueprint<ObjectType, ResultType & NewFields, IsAsync, Options & NewOptions> {
    return new Blueprint<ObjectType, ResultType & NewFields, IsAsync, Options & NewOptions>(
      this.__keptFields,
      [...this.__fieldGetters, getter],
      this.__asyncFieldGetters
    )
  }

  withAsyncFields<NewFields extends Record<string, any>>(
    getter: (obj: ObjectType) => Promise<NewFields>
  ): Blueprint<ObjectType, ResultType & NewFields, true, Options>

  withAsyncFields<NewFields extends Record<string, any>, NewOptions extends Record<string, any>>(
    getter: (obj: ObjectType, options: NewOptions) => Promise<NewFields>
  ): Blueprint<ObjectType, ResultType & NewFields, true, Options & NewOptions>

  withAsyncFields<NewFields extends Record<string, any>, NewOptions extends Record<string, any>>(
    getter: (obj: ObjectType, options: NewOptions) => Promise<NewFields>
  ): Blueprint<ObjectType, ResultType & NewFields, true, Options & NewOptions> {
    return new Blueprint<ObjectType, ResultType & NewFields, true, Options & NewOptions>(
      this.__keptFields,
      this.__fieldGetters,
      [...this.__asyncFieldGetters, getter]
    )
  }

  includeBlueprint = <
    ObjectType2 extends object,
    ResultType2 extends object,
    IsAsync2 extends boolean,
    Options2 extends Record<string, any>
  >(
    blueprint: Blueprint<ObjectType2, ResultType2, IsAsync2, Options2>
  ): Blueprint<
    ObjectType & ObjectType2,
    ResultType & ResultType2,
    IsAsync2 extends true ? true : IsAsync,
    Options & Options2
  > => {
    return new Blueprint<
      ObjectType & ObjectType2,
      ResultType & ResultType2,
      IsAsync2 extends true ? true : IsAsync,
      Options & Options2
    >(
      [...this.__keptFields, ...blueprint.__keptFields],
      [...this.__fieldGetters, ...blueprint.__fieldGetters],
      [...this.__asyncFieldGetters, ...blueprint.__asyncFieldGetters]
    )
  }

  private __keptFields: (keyof ObjectType)[] = []
  private __fieldGetters: ((obj: ObjectType, options: Options) => Record<string, any>)[] = []
  private __asyncFieldGetters: ((
    obj: ObjectType,
    options: Options
  ) => Promise<Record<string, any>>)[] = []
}

type IsEmptyObject<Object extends Record<PropertyKey, unknown>> = [keyof Object] extends [never]
  ? true
  : false

const blueprint = <ObjectType extends object>() =>
  new Blueprint<ObjectType, {}, false, {}>([], [], [])

export default blueprint
