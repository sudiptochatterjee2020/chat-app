const users = [];  // users array 

// add user
const addUSer = ({ id, username, room }) => {
    // clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    // Ensure that there is username is unique for the room 

    // returns users if the username already exists in the room
    const existingUser = users.find((user) => (user.room === room && user.username === username))
    if (existingUser) {
        return {
            error: 'Username is in use!'
        } 
    }

    // Store user if validations pass
    const user = { id, username, room}
    users.push(user)

    // return user as an object
    return { user }
};

// remove user 
const removeUser = (id) => {
    // findIndex returns the index of the user if she exists 
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) return users.splice(index, 1)[0]  // return the id of the user who is removed
};

// get user 
const getUser = (id) => {
    // use find to search user by id
    return users.find((user) => user.id === id)
};

// get users in room
const getUsersInRoom = (room) => {

    // return all users whose room matches the room name passed to the function
    return users.filter((user) => user.room === room.trim().toLowerCase())
};

module.exports = {
    addUSer, 
    removeUser,
    getUser,
    getUsersInRoom
};