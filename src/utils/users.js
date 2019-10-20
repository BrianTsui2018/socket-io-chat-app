// All active users are stored in this array
const users = []

/**
 * Add user to a room.
 * @param {Object} data id, username, room
 * @return {Object} the user
 */
const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Vaildate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) =>{
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser){
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

/**
 * Remove a user from the current room.
 * @param {String} id 
 * @return {Object} the user
 */
const removeUser = (id) => {
    // Retrieve the user's index in the users array
    const index = users.findIndex((user) => user.id === id)

    // If user is found, 
    if (index !== -1) {
        // Remove the user from users array, and return just the user to remove
        return users.splice(index, 1)[0]
    }
}

/**
 * Get a user by ID.
 * @param {String} id which is also the socket ID
 * @return {Object} the user
 */
const getUser = (id) => {
    const user = users.find((user) => user.id === id)
    if (!user){
        return {
            error: "User not found!"
        }
    }
    return { user }
}

/**
 * Get all the users for a room .
 * @param {String} room name of room
 * @return a list of user objects
 */
const getUsersInRoom = (room) => {
    const userList = users.filter((user) => user.room === room)
    return userList
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}

