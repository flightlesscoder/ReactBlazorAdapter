import { useState } from "react";

const SampleHooks = ({ onCountUpdated, message }) => {
    const [counter, setCounter] = useState(0)
    const increaseCount = () => {
        setCounter(counter + 1)
        onCountUpdated?.(counter + 1)
    }
    return (
        <div>
            You clicked {counter} times!
            <button onClick={increaseCount}>Click Me!</button>
            Blazor says {message}
        </div>
    )
}

export default SampleHooks;