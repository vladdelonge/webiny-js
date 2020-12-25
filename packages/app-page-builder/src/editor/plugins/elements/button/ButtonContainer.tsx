import React, { CSSProperties, useCallback, useRef } from "react";
import merge from "lodash/merge";
import set from "lodash/set";
import SimpleEditableText from "./SimpleEditableText";
import { PbElement } from "@webiny/app-page-builder/types";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import {
    elementByIdSelector,
    textEditorIsActiveMutation,
    textEditorIsNotActiveMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilState, useRecoilValue } from "recoil";

const DATA_NAMESPACE = "data.buttonText";
type ButtonContainerPropsType = {
    getAllClasses: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    elementId: string;
};
const ButtonContainer: React.FunctionComponent<ButtonContainerPropsType> = ({
    getAllClasses,
    elementStyle,
    elementAttributes,
    elementId
}) => {
    const eventActionHandler = useEventActionHandler();
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const { textEditorActive } = uiAtomValue;
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { type = "default", icon = {}, buttonText } = element.data || {};
    const { justifyContent } = elementStyle;
    const defaultValue = typeof buttonText === "string" ? buttonText : "Click me";
    const value = useRef<string>(defaultValue);

    const { svg = null, position = "left" } = icon || {};

    const onChange = useCallback(
        (received: string) => {
            value.current = received;
        },
        [element.id, textEditorActive]
    );

    const onFocus = useCallback(() => {
        setUiAtomValue(textEditorIsActiveMutation);
    }, [elementId]);

    const onBlur = useCallback(() => {
        setUiAtomValue(textEditorIsNotActiveMutation);
        if (value.current === defaultValue) {
            return;
        }

        const newElement: PbElement = merge(
            {},
            element,
            set({ elements: [] }, DATA_NAMESPACE, value.current)
        );

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history: true,
                merge: true
            })
        );
    }, [elementId]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent
            }}
        >
            <a
                href={null}
                style={elementStyle}
                {...elementAttributes}
                className={getAllClasses(
                    "webiny-pb-page-element-button",
                    "webiny-pb-page-element-button--" + type,
                    "webiny-pb-page-element-button__icon--" + position
                )}
            >
                {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
                <SimpleEditableText
                    value={value.current}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </a>
        </div>
    );
};

export default ButtonContainer;
