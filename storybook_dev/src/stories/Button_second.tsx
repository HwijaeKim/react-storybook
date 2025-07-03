// button.jsx
import React from "react";

import './button_second.css';

function Button2({
    type = "default",
    buttonName = "Button", 
    // onClick, 
    aria = "아리아를 입력하세요",
    disabled = false,
}) {
    if (type == "close") {
        return (
            <button
            aria-label="닫기"
            aria-hidden={disabled}
            // onClick={onClick}
            disabled={disabled}
            className="btn btn-close"
            >
                닫기
            </button>
        );
    }

    return (
        <button
            aria-label={aria}
            aria-hidden={disabled}
            // onClick={onClick}
            disabled={disabled}
            className={`btn btn-${type}`.trim()}
        >
            {buttonName}
        </button>
    );
}


export default Button2;