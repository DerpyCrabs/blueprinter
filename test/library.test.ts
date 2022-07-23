import blueprint from '../src/index'

type User = { id: number; name: string }
const user = { id: 1, name: 'test' }
type Book = { title: string; isdn: string }
const book: Book = { title: 'blueprints', isdn: '123' }

describe('Blueprint creation', () => {
  it('can keep fields of object', () => {
    const userIdBlueprint = blueprint<User>().keepFields(['id'])
    const userIdAndNameBlueprint = blueprint<User>().keepFields(['id', 'name'])
    expect(userIdBlueprint.render(user)).toEqual({ id: user.id })
    expect(userIdAndNameBlueprint.render(user)).toEqual({ id: user.id, name: user.name })
  })

  it('can create new fields based on object', () => {
    const userNameUppercaseBlueprint = blueprint<User>().withFields((obj) => ({
      name: obj.name.toUpperCase(),
    }))
    expect(userNameUppercaseBlueprint.render(user)).toEqual({ name: user.name.toUpperCase() })
  })

  it('can create new fields based on object asynchronously', async () => {
    const userNameUppercaseBlueprint = blueprint<User>().withAsyncFields(
      (obj): Promise<{ name: string }> =>
        new Promise((r) =>
          r({
            name: obj.name.toUpperCase(),
          })
        )
    )
    expect(await userNameUppercaseBlueprint.render(user)).toEqual({ name: user.name.toUpperCase() })
  })

  it('supports multiple method composition', async () => {
    const userNameUppercaseBlueprint = blueprint<User>()
      .keepFields(['id'])
      .keepFields(['name'])
      .withFields((obj) => ({
        syncName: obj.name.toUpperCase(),
      }))
      .withFields((obj) => ({
        syncName2: obj.name.toUpperCase(),
      }))
      .withAsyncFields(
        (obj): Promise<{ asyncName: string }> =>
          new Promise((r) =>
            r({
              asyncName: obj.name.toUpperCase(),
            })
          )
      )
      .withAsyncFields(
        (obj): Promise<{ asyncName2: string }> =>
          new Promise((r) =>
            r({
              asyncName2: obj.name.toUpperCase(),
            })
          )
      )
    expect(await userNameUppercaseBlueprint.render(user)).toEqual({
      id: user.id,
      name: user.name,
      syncName: user.name.toUpperCase(),
      syncName2: user.name.toUpperCase(),
      asyncName: user.name.toUpperCase(),
      asyncName2: user.name.toUpperCase(),
    })
  })

  it('can render array of objects with renderArray', async () => {
    const userNameUppercaseBlueprint = blueprint<User>().withFields((obj) => ({
      name: obj.name.toUpperCase(),
    }))
    expect(userNameUppercaseBlueprint.renderArray([user, user])).toEqual([
      { name: user.name.toUpperCase() },
      { name: user.name.toUpperCase() },
    ])

    const asyncUserNameUppercaseBlueprint = blueprint<User>().withAsyncFields(
      (obj): Promise<{ name: string }> =>
        new Promise((r) =>
          r({
            name: obj.name.toUpperCase(),
          })
        )
    )
    expect(await asyncUserNameUppercaseBlueprint.renderArray([user, user])).toEqual([
      { name: user.name.toUpperCase() },
      { name: user.name.toUpperCase() },
    ])
  })
})

describe('Blueprint composition', () => {
  it('supports sync blueprint composition', () => {
    const userIdBlueprint = blueprint<User>().keepFields(['id'])
    const userNameBlueprint = blueprint<User>().keepFields(['name'])
    const userIdAndNameBlueprint = blueprint<User>()
      .includeBlueprint(userIdBlueprint)
      .includeBlueprint(userNameBlueprint)
    expect(userIdAndNameBlueprint.render(user)).toEqual({ id: user.id, name: user.name })
  })

  it('supports async blueprint composition', async () => {
    const userMessagesBlueprint = blueprint<User>().withAsyncFields(
      (user: User): Promise<{ messages: [] }> => new Promise((r) => r({ messages: [] }))
    )
    const userNameUppercaseBlueprint = blueprint<User>().withAsyncFields(
      (obj): Promise<{ asyncName: string }> =>
        new Promise((r) =>
          r({
            asyncName: obj.name.toUpperCase(),
          })
        )
    )
    const userWithUppercaseNameAndMessagesBlueprint = blueprint<User>()
      .includeBlueprint(userNameUppercaseBlueprint)
      .includeBlueprint(userMessagesBlueprint)
    expect(await userWithUppercaseNameAndMessagesBlueprint.render(user)).toEqual({
      asyncName: user.name.toUpperCase(),
      messages: [],
    })
  })

  it('supports composition between sync and async blueprints', async () => {
    const userIdBlueprint = blueprint<User>().keepFields(['id'])
    const userMessagesBlueprint = blueprint<User>().withAsyncFields(
      (user: User): Promise<{ messages: [] }> => new Promise((r) => r({ messages: [] }))
    )
    const userWithIdAndMessages = blueprint<User>()
      .includeBlueprint(userIdBlueprint)
      .includeBlueprint(userMessagesBlueprint)
    expect(await userWithIdAndMessages.render(user)).toEqual({ id: user.id, messages: [] })
  })

  it('supports composition between different object type blueprints', () => {
    const userBlueprint = blueprint<User>().keepFields(['id', 'name'])
    const bookBlueprint = blueprint<Book>().keepFields(['title', 'isdn'])
    const userAndBookBlueprint = blueprint()
      .includeBlueprint(userBlueprint)
      .includeBlueprint(bookBlueprint)
    expect(userAndBookBlueprint.render({ ...user, ...book })).toEqual({
      id: user.id,
      name: user.name,
      title: book.title,
      isdn: book.isdn,
    })
  })
})

describe('Blueprint options', () => {
  it('supports passing options in render', () => {
    const userBlueprint = blueprint<User>().withFields(
      (user: User, { surname }: { surname: string }) => ({ surname })
    )

    expect(userBlueprint.render(user, { surname: 'surname' })).toEqual({ surname: 'surname' })
  })

  it('requires options from all getters', () => {
    const userBlueprint = blueprint<User>()
      .withFields((user: User, { surname }: { surname: string }) => ({ surname }))
      .withFields((user: User, { lastName }: { lastName: string }) => ({ lastName }))

    expect(userBlueprint.render(user, { surname: 'surname', lastName: 'lastName' })).toEqual({
      surname: 'surname',
      lastName: 'lastName',
    })
  })
})
