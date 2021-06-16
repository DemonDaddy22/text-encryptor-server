/**
 * @param {string} url
 * @returns boolean value indicating if `url` is valid tinyURL or not
 */
const isValidTinyURL = (url) => {
    const tinyurlRegex = /https:\/\/tinyurl\.com\/[a-zA-Z0-9]+/;
    return tinyurlRegex.test(url);
};

export default isValidTinyURL;
