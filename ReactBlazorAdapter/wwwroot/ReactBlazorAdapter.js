const showLog = false
const log = showLog ? console.log : () => undefined
log('ReactBlazorAdapter load')
const ReactBlazorAdapter = globalThis.ReactBlazorAdapter = globalThis.ReactBlazorAdapter || {
  components: [],
  rootComponents: [],
  pendingRoots: [],
  React: undefined,
  ReactDOM: undefined,
  prepareProps(rootName, rootProps, dotNetRef, componentCtor) {
    console.log('Is React class?', componentCtor?.prototype?.isReactComponent)
    const componentCanRef = !!componentCtor?.prototype?.isReactComponent
    const defaultProps = componentCanRef
      ? { ref: ReactBlazorAdapter.setRef.bind(ReactBlazorAdapter, rootName, rootProps?.ref) }
      : {}
    const combinedProps = Object.assign(defaultProps, rootProps)
    Object.keys(combinedProps).map(key => {
      const p = combinedProps[key]
      // Detect regardless of serialization settings
      if(p?.iS_REACT_BLAZOR_CALLBACK || p?.IS_REACT_BLAZOR_CALLBACK) {
        log(`${key} is a callback from js`)
        combinedProps[key] = ReactBlazorAdapter.callbackReceiver.bind(
            ReactBlazorAdapter,
            rootName,
            key,
            dotNetRef
          )
      }
    })
    return combinedProps
  },
  initialize(react, reactDOM) {
    log('initialize ...')
    ReactBlazorAdapter.ReactDOM = reactDOM
    ReactBlazorAdapter.React = react
    log('check for pending...')
    ReactBlazorAdapter.pendingRoots.forEach(r => {
      log('pending root initialize', r.rootName)
      ReactBlazorAdapter.createRoot(r.rootName, r.componentName, r.domSelector, r.dotNetRef, r.rootProps)
    })
  },
  callbackReceiver(rootName, propName, dotNetRef, ...args) {
    if(!dotNetRef) {
      console.error('Tried to invoke a callback from React, but no parent blazor component reference was available. Did you specify attribute CallbackTo=this in your blazor component?')
    }
    if(!dotNetRef?.invokeMethod) {
      console.error('dotNetRef missing invokeMethod - is it a .NET reference object from blazor?')
    }
    log('Invoking', propName)
    dotNetRef.invokeMethod(propName, ...args)
  },
  setRef(rootName, anyPassedRef, renderedComponent) {
    log('setRef', rootName)
    anyPassedRef?.(...args)
    const root = ReactBlazorAdapter.rootComponents.find(r => r.rootName === rootName)
    if(!root) {
      console.error(`Error setting ref for ${rootName}`)
      return
    }
    root.renderedComponent = renderedComponent
  },
  createRoot(rootName, componentName, domSelector, dotNetRef, rootProps = {}) {
    log('createRoot', rootName, rootProps)
    // Remove from any pending
    ReactBlazorAdapter.pendingRoots = ReactBlazorAdapter.pendingRoots.filter(pr => pr.rootName !== rootName)
    if(ReactBlazorAdapter.rootComponents.some(rc => rc.rootName === rootName)) {
      console.error(`Root ${rootName} already registered.`)
      return
    }
    if(!componentName || !domSelector) {
      console.error('A valid componentName and domSelector are required.')
      return
    }
    const component = ReactBlazorAdapter.components.find(c => c.name === componentName)
    if(!component
      || !ReactBlazorAdapter.ReactDOM
      || !ReactBlazorAdapter.React) {
      log('createRoot push pending', rootName)
      ReactBlazorAdapter.pendingRoots.push({ dotNetRef, rootName, componentName, domSelector, rootProps: { ...rootProps } })
      return
    }
    const domContainer = document.querySelector(domSelector)
    if(!domContainer) {
      console.error(`Component ${componentName} could not find DOM element ${domSelector} to mount to.`)
      return
    }
    
    const combinedProps = ReactBlazorAdapter.prepareProps(rootName, rootProps, dotNetRef, component.ctor)
    log('createRoot createElement', rootName)
    
    const instance = ReactBlazorAdapter.React.createElement(component.ctor, combinedProps)
    // the below may have squiggles in IDEs even though it is valid because createRoot name matches
    //TODO: test on older React versions
    const reactRoot = ReactBlazorAdapter.ReactDOM.createRoot(domContainer)
    reactRoot.render(instance)
    ReactBlazorAdapter.rootComponents.push({
      component,
      domContainer,
      rootName,
      componentName,
      domSelector,
      rootProps,
      reactRoot,
      instance,
      renderedComponent: undefined,
      dotNetRef
    })
  },
  unmountRoot(rootName) {
    log('unmount', rootName)
    const root = ReactBlazorAdapter.rootComponents.find(r => r.rootName === rootName)
    if(!root) {
      console.error('Could not find root to unmount ' + rootName)
      return
    }
    //TODO: test with React 17, 18, 19 with unmountComponentAtNode 
    log('unmounting now')
    root.reactRoot.unmount()
    log('unmounted')
    ReactBlazorAdapter.rootComponents = ReactBlazorAdapter.rootComponents.filter(rc => rc !== root)
  },
  registerComponent(componentName, componentCtor) {
    log('register component:', componentName)
    if(!componentName || !componentCtor) {
      console.error('A valid componentName and componentCtor are required.')
      return
    }
    ReactBlazorAdapter.components = ReactBlazorAdapter.components
        .filter(c => c.name !== componentName)
        .concat([{ name: componentName, ctor: componentCtor }])
    log('check for pending from components...')
    ReactBlazorAdapter.pendingRoots.forEach(r => {
      if(componentName === r.componentName) {
        log('pending root initialize', r.rootName)
        ReactBlazorAdapter.createRoot(r.rootName, r.componentName, r.domSelector, r.dotNetRef, r.rootProps)
        ReactBlazorAdapter.pendingRoots = ReactBlazorAdapter.pendingRoots.filter(pr => pr !== r)
      }
    })
  },
  rerenderRoot(rootName, rootProps = {}) {
    log('rerenderRoot', rootName)
    const root = ReactBlazorAdapter.rootComponents.find(r => r.rootName === rootName)
    if(!root) {
      console.error(`Root ${rootName} not found. Maybe it is unmounted or not created.`)
    }
    const combinedProps = ReactBlazorAdapter.prepareProps(rootName, rootProps, root.dotNetRef, root.component.ctor)
    log('passing rerender combined', combinedProps)
    const instance = ReactBlazorAdapter.React.createElement(root.component.ctor, combinedProps)
    root.reactRoot.render(instance)
  },
  invokeMethod(rootName, methodName, ...methodArgs) {
    //TODO: test with older React since this is different from previous versions
    const root = ReactBlazorAdapter.rootComponents.find(r => r.rootName === rootName)
    if(!root) {
      console.error(`Root ${rootName} not found. Maybe it is unmounted or not created.`)
      return
    }
    if(!root?.renderedComponent?.[methodName]?.call) {
      console.error(`Component ${rootName} ${methodName} method was not found.`)
      return
    }
    log(`Call method ${rootName} ${methodName} with ${methodArgs?.length} arguments`)
    return root.renderedComponent[methodName].call(root.renderedComponent, ...methodArgs)
  },
}

export default ReactBlazorAdapter
