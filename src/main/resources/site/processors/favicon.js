const portal = require('/lib/xp/portal')
const cacheLib = require('/lib/cache')

// Sizes of images generated:
const sizes = [57, 60, 72, 76, 114, 120, 144, 152, 180] // rel=apple-touch-icon
const altSizes = [16, 32, 96, 192] // rel=icon
const imageTypes = {
  'png': 'image/png',
  'jpg': 'image/jpg',
  'gif': 'image/gif',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg'
}

exports.responseProcessor = function(req, res) {
  const siteConfig = portal.getSiteConfig()
  const imageId = siteConfig.favicon

  if (!imageId) {
    return res
  }

  const headEnd = res.pageContributions.headEnd
  if (!headEnd) {
    res.pageContributions.headEnd = []
  } else if (typeof(headEnd) === 'string') {
    res.pageContributions.headEnd = [headEnd]
  }

  res.pageContributions.headEnd.push(createMetaLinks(siteConfig))

  return res
}

function createMetaLinks(siteConfig) {
  const createImageUrl = getCreateImageFn(siteConfig.favicon)
  const cache = getCache(siteConfig).cache
  return cache.get('favicon-image-generator-cache', function() {
    return [createMetaLink(64, 'shortcut icon', 'png')]
      .concat(sizes.map(function(size) {
        return createMetaLink(size, 'apple-touch-icon')
      }))
      .concat(altSizes.map(function(size) {
        return createMetaLink(size, 'icon', 'png')
      }))
      .join('\n')
  })

  function createMetaLink(size, rel, type) {
    const imageUrl = createImageUrl(`square(${size})`, type)
    const mimeType = imageTypes[(type || 'jpg').toLowerCase()]
    const typeStr = mimeType ? `type="${mimeType}"` : ""
    return `<link rel="${rel}" sizes="${size}x${size}" href="${imageUrl}" ${typeStr} />`
  }
}

function getCreateImageFn(imageId) {
  return function(scale, format) {
    const url = portal.imageUrl({
      id: imageId,
      scale: scale,
      format: format || 'jpg',
      type: 'absolute'
    })
    const root = portal.pageUrl({
      path: portal.getSite()._path
    })
    return url.replace(/(.*)\/_\/image/, root + '_/image') // Rewriting url to point to base-url of the app.
  }
}

var cacheObject = null

function getCache(siteConfig) {
  if (!cacheObject || cacheObject.ttl !== siteConfig.ttl || siteConfig.favicon !== cacheObject.imageId) {
    cacheObject = createCache(siteConfig.ttl, siteConfig.favicon)
  }
  return cacheObject
}

function createCache(ttl, imageId) {
  return {
    ttl: ttl,
    imageId: imageId,
    cache: cacheLib.newCache({
      size: 100,
      expire: ttl || 300
    })
  }
}
