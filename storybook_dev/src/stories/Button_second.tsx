import React from "react";
import './button_second.css';

interface Button2Props {
    type?: "default" | "primary" | "secondary" | "close";
    buttonName?: string;
    onClick?: () => void;
    aria?: string;
    disabled?: boolean;
    bgColor?: string;
    textColor?: string;
}

function Button2({
    type = "default",
    buttonName = "Button",
    onClick,
    aria = "아리아를 입력하세요",
    disabled = false,
    bgColor,     
    textColor,     
}: Button2Props) {
    const customStyle = {
        backgroundColor: bgColor,
        color: textColor,
    };

    if (type === "close") {
        return (
        <button
            aria-label="닫기"
            aria-hidden={disabled}
            onClick={onClick}
            disabled={disabled}
            className="btn btn-close"
            style={bgColor || textColor ? customStyle : undefined}
        >
            닫기
        </button>
        );
    }

    return (
        <button
        aria-label={aria}
        aria-hidden={disabled}
        onClick={onClick}
        disabled={disabled}
        className={`btn btn-${type}`.trim()}
        style={bgColor || textColor ? customStyle : undefined}
        >
        {buttonName}
        </button>
    );
}

export default Button2;
