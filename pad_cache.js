var padCache = [];

function pad_cache(data) {
    if ((data['srcId'] == data['deadPeers'][0]) && (!padCache.includes(data['padId']))) {
        padCache.push(data['padId']);
    }
}

function get_pad_status() {
    return padCache;
}

module.exports = {
    pad_cache,
    get_pad_status
}