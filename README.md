# ReactBlazorAdapter

## What is it?

This project aims to be a lightweight adapter that allows embedding React components in Blazor while integrating the React lifecycle and providing support for callbacks to Blazor components.
When your Blazor component is disposed, the react component tree will be unmounted (ie: event handlers managed by react will be unsubscribed).

## Examples and Demos

[Please check out the sample projects here.](https://github.com/flightlesscoder/ReactBlazorAdapter/tree/main/Demos)

## Setup

* [Add a reference](#adding-a-nuget-reference) to ReactBlazorAdapter (nuget)
* [Include the script](#including-adapter-javascript) for ReactBlazorAdapter (JS)
* [Initialize ReactBlazorAdapter](#initializing-reactblazoradapter) with references to React, ReactDOM in your JavaScript bundle/app
* [Consume React components](#using-react-components) with the Blazor `<ReactComponent>`
* [Receive callbacks from React](#receiving-callbacks-from-react-components-in-blazor) with one extra step
* [Update props from Blazor](#updating-props-from-blazor) with built-in `StateHasChanged()`

## Adding a nuget Reference

Like any other nuget package, you can use the dotnet CLI:

```
# for Blazor WebAssembly Standalone App
dotnet add package ReactBlazorAdapter

# for .NET MAUI Blazor Hybrid App
dotnet add package ReactBlazorAdapter.RCL
```

Or use your favorite IDE to add a nuget package reference to the consuming Blazor WASM project.

## Including Adapter JavaScript

For Blazor projects hosted by Visual Studio/Rider, you can add a reference to your index.html file such as:
```
<!-- For Blazor WebAssembly Standalone App -->
<script src="/_content/ReactBlazorAdapter/ReactBlazorAdapter.js"></script>

<!-- For Blazor MAUI -->
<script src="_content/ReactBlazorAdapter.RCL/ReactBlazorAdapter.MAUI.js"></script>

<!-- IE: a create-react-app bundled JS file, components registered here: -->
<script src="static/js/my-react-bundle.js"></script>

<!-- Blazor built-in JS comes last -->
<!-- For Blazor WebAssembly Standalone -->
<script src="_framework/blazor.webassembly.js"></script>

<!-- For Blazor MAUI -->
<script src="_framework/blazor.webview.js" autostart="false"></script>
```

## Initializing ReactBlazorAdapter

`ReactBlazorAdapter` is created as a window-level variable (ie: accessible from either `window.ReactBlazorAdapter` or `globalThis.ReactBlazorAdapter`), due to the need to interop between JavaScript and Blazor.

Within your React code, add the following:
```javascript
/*global globalThis*/
import React from 'react'
import ReactDOM from 'react-dom'
import FooComponent from './path/to/FooComponent'

// Pass React and ReactDOM to initialize()
globalThis["ReactBlazorAdapter"].initialize(React, ReactDOM)
// Register your top-level react components that Blazor will consume
// "fooname" is an arbitrary alias that is shared with Blazor passed to the ComponentName attribute in Blazor
globalThis["ReactBlazorAdapter"].registerComponent('fooname', FooComponent)
```

## Using React Components

Within your Blazor markup, add the `using` directive and leverage the `ReactComponent` Blazor component.
```htmlinblazor
@using ReactBlazorAdapter.Components //Blazor Standalone WASM
@using ReactBlazorAdapter.RCL.Components //Blazor MAUI
<!-- ... -->
<ReactComponent
        ComponentName="foo"
        ElementId="foocontainer"
/>
```

### Getting a `ref` to `class` components

While ReactBlazorAdapter works with top-level hooks components, React does not allow setting a `ref` for hooks-based components. `React.forwardRef` is not supported by ReactBlazorAdapter, but you can obtain a `ref` to a React class-based component by passing a `@ref` attribute.

```htmlinblazor
<ReactComponent
        ComponentName="foo"
        ElementId="foocontainer"
        @ref="FooComponent"
        message="@MessageFromBlazor"
/>
<!-- ... -->
@code {
    public ReactComponent FooComponent { get; set; }
    public string MessageFromBlazor { get; set; } = "Hello world!";
}
```

### Invoking instance methods on class-based React components

If your class-based component has instance methods, you can invoke them from Blazor within the `@code {...}` block:

```csharp
    // ie given a React component
    class FooComponent extends React.Component {
        showAlert(message) {
          alert(message);
          return 42;
        }
        //...
    }
    // you can invoke 'showAlert', which returns an int and accepts a string:
    private async Task CallFromBlazor()
    {
        LastReactValue = await FooComponent.InvokeMethod<int>("showAlert", new object[]
        {
            "Hello from Blazor!"
        });
    }
```

### Receiving callbacks from React components in Blazor

Receiving callbacks from React requires passing a reference to the current Blazor component, so that it can be accessed from JavaScript, and making a `[JSInvokable]` method in your Blazor component.
Also, the exact prop name from React should be used in Blazor markup and match with the `[JSInvokable]` attribute.

```htmlinblazor
<ReactComponent
        ComponentName="foo"
        ElementId="foocontainer"
        CallbackTo="this"
        onCountUpdated="@OnUpdatedCallback"
/>

@code {
    public int LastReactValue { get; set; }

    [JSInvokable("onCountUpdated")]
    public void OnUpdatedCallback(int value)
    {
        Console.WriteLine("Blazor updated by react! " + value);
        LastReactValue = value;
        StateHasChanged();
    }
}
```

## Updating props from Blazor

Props passed to React are updated the same way other state in Blazor markup is updated, ie using `StateHasChanged()`

```htmlinblazor
<ReactComponent
        ComponentName="foo"
        ElementId="foocontainer"
        CallbackTo="this"
        message="@Message"
/>
@code {
  public string Message { get; set; } = "initial";
  // ...
  public void UpdateMessage() {
    Message = $"Updated at {DateTime.Now.ToShortTimeString()}";
    StateHasChanged();
  }
}
```

## Q&amp;A

### How can I change the wrapping element?

The Blazor `ReactComponent` by default will create a `div` to mount the top-level React component to.
You can change the element using the `ElementName` Blazor attribute.

```htmlinblazor
<ReactComponent
        ComponentName="foo"
        ElementId="foocontainer"
        ElementName="customelement"
/>

```

### Why didn't my component show up?

* Make sure you've called `ReactBlazorAdapter.initialize()` with React and ReactDOM
* Make sure you've registered your component using `ReactBlazorAdapter.registerComponent()`
* Check the developer log carefully for all console errors

### What versions of React and .NET are supported?

Currently only .NET 8.0 and React 18 are supported, but I'd like to add support for older versions of React and .NET 6.0 in the future.

### I have a create-react-app bundle, how can I use it?

[See the demo examples here](https://github.com/flightlesscoder/ReactBlazorAdapter/tree/main/Demos). In your `App.js` file, add:

```
/*global globalThis*/
// the above line informs eslint that this standard global variable exists
// add React and ReactDOM explicit imports:
import React from 'react';
import ReactDOM from 'react-dom';
import SampleComponent from 'path/to/component';

//...App component code...

// initialize and register components
globalThis["ReactBlazorAdapter"].initialize(React, ReactDOM);
globalThis["ReactBlazorAdapter"].registerComponent('sample-app', App);
globalThis["ReactBlazorAdapter"].registerComponent('sample-component', SampleComponent);

export default App
```

Add the compiled output to `wwwroot/static/js` (ie "main" and "chunk" files). Reference them from `index.html` after the `ReactBlazorAdapter.js` file and before `blazor.webview.js` (ie for MAUI).

As create-react-app expects a div with id "root", if you do not wish to eject and customize your create-react-app, you may want to add a `<div id="root" style="display: none;" />` to your `index.html` file to avoid a console error.

### What about Blazor Server (SSR/Stream/etc.)?

Blazor server is not currently supported. I have a working POC but haven't published it. This may change in the future.

### Passing methods as attributes to ReactComponent causes Visual Studio to suggest invoking the method (CS8974)

This seems to be an open issue with the C# toolchain that has been fixed before:
https://github.com/dotnet/roslyn/issues/60423
https://github.com/dotnet/roslyn/issues/68307

One way to prevent these warnings is to cast the delegate to object explicitly, for example:
```
onCountUpdated="@((object)OnUpdatedCallback)"
// vs
onCountUpdated="@OnUpdatedCallback"
```

### License and Copyright

This project is licensed under the Apache 2.0 license (see LICENSE.md).
© 2024 Katie Michelle Snead
