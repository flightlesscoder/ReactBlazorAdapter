import { Component } from 'react'

class SampleClass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            counter: 0
        }
    }
    showAlert(someText) {
        alert('This text from blazor: ' + someText)
        return this.state.counter
    }
    setCounter = () => {
        this.setState((state) => ({
            counter: state.counter + 1
        }))
        this.props.onCountUpdated?.(this.state.counter + 1)
    }
    render() {
        return (
            <div>
                You clicked {this.state.counter} times!
                <button onClick={this.setCounter}>Click Me!</button>
                Blazor says {this.props.message}
            </div>
        )
    }
}

export default SampleClass