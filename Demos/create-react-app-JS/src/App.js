/*global globalThis*/
import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import SampleHooks from "./SampleHooks";
import SampleClass from "./SampleClass";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

globalThis["ReactBlazorAdapter"].initialize(React, ReactDOM)
globalThis["ReactBlazorAdapter"].registerComponent('sample-app', App)
globalThis["ReactBlazorAdapter"].registerComponent('sample-hooks', SampleHooks)
globalThis["ReactBlazorAdapter"].registerComponent('sample-class', SampleClass)

export default App;
