"use strict";
const axios = require('axios').default;
const FormData = require('form-data');


// This is hard-coded in https://www.life360.com/circles/scripts/ccf35026.scripts.js
const LIFE360_CLIENT_SECRET = "cFJFcXVnYWJSZXRyZTRFc3RldGhlcnVmcmVQdW1hbUV4dWNyRUh1YzptM2ZydXBSZXRSZXN3ZXJFQ2hBUHJFOTZxYWtFZHI0Vg==";
const LIFE360_API = "https://api.life360.com/v3"

const authHeaders = (session) => ({
    headers: {'Authorization': `${session.token_type} ${session.access_token}`}
});

const handleError = (errorPrefix) => (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`${errorPrefix}: ${error.response.status} ${error.response.data?.errorMessage}`)
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        throw new Error(`${errorPrefix}: ${error.response.status} ${error.response.data}`)
    } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`${errorPrefix}: ${error.message}`)
    }
}

/**
 * Login to life360.com and get an oauth token.
 * Specify a username OR both a phone number and country code.
 * username:     Life360 username, or undefined if phone specified.
 * password:     Life360 password.
 * phone:        Life360 phone, or undefined if username specified.
 * countryCode:  Optional phone country code, defaults to 1 if not specified.
 * returns:      Life360 session.
 */
module.exports.authenticate = function (username, password) {
    username = typeof username !== 'undefined' ? username : '';

    if (!password) return Promise.reject(new Error("No password specified."))

    const form = {
        username,
        password,
        grant_type: 'password'
    };
    const bodyFormData = Object.keys(form).reduce((formData, key) => {
        formData.append(key, form[key]);
        return formData;
    },  new FormData())

    return axios.post(`${LIFE360_API}/oauth2/token.json`, bodyFormData, {
        headers: {
            'Authorization': `Authorization: Basic ${LIFE360_CLIENT_SECRET}`,
            ...bodyFormData.getHeaders()
        },
    }).then(response => {
        if (!response.data.access_token) {
            throw new Error("Unauthorized");
        } else {
            return {
                access_token: response.data.access_token,
                token_type: response.data.token_type
            };
        }
    }).catch(handleError('Life360 server error logging in'))
}

/**
 * Fetch the user's circles
 */
module.exports.circles = function (session) {
    if (!session) return Promise.reject(new Error("session not specified"))
    return axios.get(`${LIFE360_API}/circles`, authHeaders(session))
        .then(({data}) => data.circles)
        .catch(handleError('Life360 server error getting circles'))
}

/**
 * Fetch a specific circle by circle ID
 */
module.exports.circle = function (session, circleId) {
    if (!session) return Promise.reject(new Error("session not specified"))
    if (!circleId) return Promise.reject(new Error("circleId not specified"))
    return axios.get(`${LIFE360_API}/circles/${circleId}`, authHeaders(session))
        .then(({data}) => data)
        .catch(handleError('Life360 server error getting circle'))
}

/**
 * Fetch the user's places
 */
module.exports.places = function (session, circleId) {
    if (!session) return Promise.reject(new Error("session not specified"))
    return axios.get(`${LIFE360_API}/circles/${circleId}/allplaces`, authHeaders(session))
        .then(({data}) => data.places)
        .catch(handleError('Life360 server error getting places'))
}

/**
 * Fetch the user's members
 */
module.exports.members = function (session, circleId) {
    if (!session) return Promise.reject(new Error("session not specified"))
    return axios.get(`${LIFE360_API}/circles/${circleId}members`, authHeaders(session))
        .then(({data}) => data.members)
        .catch(handleError('Life360 server error getting members'))
}
