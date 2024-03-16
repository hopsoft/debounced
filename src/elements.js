function uniqueId(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return element?.nodeName
  if (element.id && document.querySelectorAll(`#${element.id}`).length === 1) return element.id

  const treeWalker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, null, false)

  let currentNode = null
  let index = 0

  while (currentNode !== element) {
    currentNode = treeWalker.nextNode()
    index++
  }

  return `${element.nodeName.toLowerCase()}-${index}`
}

export default { uniqueId }
