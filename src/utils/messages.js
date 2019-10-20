/**
 * Message data indicating who, what, when.
 * @param {String} username 
 * @param {String} text 
 * @return {Object} username, text, createdAt
 */
const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }

}

/**
 * Message data indicating who, api query string, when. 
 * @param {String} username 
 * @param {String} url - expects a Google Map query string with longitude and latitude 
 */
const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }

}

module.exports = {
    generateMessage,
    generateLocationMessage
}