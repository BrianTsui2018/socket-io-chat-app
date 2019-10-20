/**
 * Client side
 */
const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

/**
 * Autoscroll feature.
 * Sets the chatbox scroll height.
 * Determine where the current scroll is. 
 * If it is not at the bottom, autoscroll would be disabled.
 */
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

/**
 * When client receives a "message" event from server, render in page
 */
socket.on('message', (message) => {
    
    // Create a Mustache html, using a template and the data (who, what, when)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    // Insert html at the bottom the message box
    $messages.insertAdjacentHTML('beforeend', html)

    // Call autoscroll feature
    autoscroll()
})

/**
 * Event listener for the send message button
 */
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    
    // Temporarily block the send button
    $messageFormButton.setAttribute('disabled', 'disabled')

    // Get the message from text field
    const message = e.target.elements.message.value

    // Send "sendMessage" event to server, along with message data
    socket.emit('sendMessage', message, (error) => {
        // Re-enable button
        $messageFormButton.removeAttribute('disabled')
        // Clear the text field
        $messageFormInput.value = ''
        // Focus set to text field for client to type again
        $messageFormInput.focus()

        // Error handling
        if (error) {
            return console.log(error)
        }
    })
})

/**
 * Event listener to the send location button
 */
$sendLocationButton.addEventListener('click', ()=>{
    // Confirm if browser supports
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    
    // Temporarily disable button
    $sendLocationButton.setAttribute('disabled','disabled')

    // Get geolocation from browser
    navigator.geolocation.getCurrentPosition( (position) => {
        // Construst query url string from data and send event to server
        socket.emit('sendLocation', {longitude: position.coords.longitude, latitude: position.coords.latitude}, () => {
            // Re-enable button
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

/**
 * Receiving location sharing message from server
 */
socket.on('locationMessage', (message) => {
    // Create Mustache html from data
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // Render html to message box
    $messages.insertAdjacentHTML('beforeend', html)

    // Call autoscroll feature
    autoscroll()
})

/**
 * Receiving room data update from server
 */
socket.on('roomData', ({ room, users}) =>{
    // Create Mustache html from data    
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    // Render html to sidebar (room user list)
    document.querySelector('#sidebar').innerHTML = html
})

/**
 * Send "join" event to server,
 * called when login
 */
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'     // send user back to login page if failed
    }
})