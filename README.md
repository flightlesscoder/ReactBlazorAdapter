# ReactBlazorAdapter

## What is it?

This project aims to be a lightweight adapter that allows embedding React components in Blazor while integrating the React lifecycle and providing support for callbacks to Blazor components.
When your Blazor component is disposed, the react component tree will be unmounted (ie: event handlers managed by react will be unsubscribed).

## Setup

* [Add a reference](#adding-a-nuget-reference) to ReactBlazorAdapter (nuget)
* [Include the script](#including-adapter-javascript) for ReactBlazorAdapter (JS)
* [Initialize ReactBlazorAdapter](#initializing-reactblazoradapter) with references to React, ReactDOM
* [Consume React components](#using-react-components) with the Blazor `<ReactComponent>`
* [Receive callbacks from React](#receiving-callbacks-from-react-components-in-blazor) with one extra step
* [Update props from Blazor](#updating-props-from-blazor) with built-in `StateHasChanged()`

## Adding a nuget Reference

Like any other nuget package, you can use the dotnet CLI: (coming soon!)

```
dotnet add package ReactBlazorAdapter
```

Or use your favorite IDE to add a nuget package reference to the consuming Blazor WASM project.

## Including Adapter JavaScript

For Blazor projects hosted by Visual Studio/Rider, you can add a reference to your index.html file such as:
```
<script type="module" src="/_content/ReactBlazorAdapter/ReactBlazorAdapter.js"></script>
```

**Make sure to include this script before any code that registers your React components** with the ReactBlazorAdapter.
You can also include the raw `ReactBlazorAdapter.js` file from this repository, which should be less than 2 kB gzipped.

## Initializing ReactBlazorAdapter

`ReactBlazorAdapter` is created as a window-level variable (ie: accessible from either `window.ReactBlazorAdapter` or `globalThis.ReactBlazorAdapter`), due to the need to interop between JavaScript and Blazor.

Within your React code, add the following:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client' //React 18 is from 'react-dom'
import FooComponent from './path/to/FooComponent'
// Pass React and ReactDOM to initialize()
ReactBlazorAdapter.initialize(React, ReactDOMClient)
// Register your top-level react components that Blazor will consume
// "fooname" is an arbitrary alias that is shared with Blazor passed to the ComponentName attribute in Blazor
ReactBlazorAdapter.registerComponent('fooname', FooComponent)
```

## Using React Components

Within your Blazor markup, add the `using` directive and leverage the `ReactComponent` Blazor component.
```htmlinblazor
@using ReactBlazorAdapter.Components
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

### License and Copyright

This project is licensed under the Apache 2.0 license (see LICENSE.md).
© 2024 Katie Michelle Snead