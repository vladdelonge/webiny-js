import React from "react";
import Slate from "@webiny/app-page-builder/editor/components/Slate";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { SlateEditorProps } from "@webiny/app-page-builder/editor/components/Slate/Slate";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { useRecoilValue } from "recoil";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextType = Omit<SlateEditorProps, "value"> & {
    elementId: string;
};
const Text: React.FunctionComponent<TextType> = ({ elementId }) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }
    const onChange = React.useCallback(
        value => {
            handler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        data: {
                            ...element.data,
                            text: value
                        }
                    }
                })
            );
        },
        [element.id]
    );

    const text = element.data.text;
    return (
        <ElementRoot element={element} className={className}>
            <Slate value={text} onChange={onChange} />
        </ElementRoot>
    );
};
export default React.memo(Text);
