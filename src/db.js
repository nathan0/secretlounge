import low from 'lowdb'
const db = low('db.json')

db.defaults({ users: [] }).value()

export const getUser = (id) => db.get('users').find({ id }).value()
export const addUser = (id) => db.get('users').push({ id }).value()
export const delUser = (id) => db.get('users').remove({ id }).value()
export const getUsers = () => db.get('users').value()
