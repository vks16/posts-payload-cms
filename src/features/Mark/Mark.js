import React from "react";
import '@fortawesome/fontawesome-free/css/all.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHighlighter } from '@fortawesome/free-solid-svg-icons';

const MarkIcon = () => {
    return <FontAwesomeIcon icon={faHighlighter} title="<mark></mark>"/>
}

export default MarkIcon