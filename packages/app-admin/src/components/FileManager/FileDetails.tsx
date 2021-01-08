import React from "react";
import bytes from "bytes";
import { css } from "emotion";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";
import getFileTypePlugin from "./getFileTypePlugin";
import get from "lodash/get";
import set from "lodash/set";
import cloneDeep from "lodash/cloneDeep";
import Tags from "./FileDetails/Tags";
import Name from "./FileDetails/Name";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as DownloadIcon } from "./icons/round-cloud_download-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/delete.svg";
import TimeAgo from "timeago-react";
import { useFileManager } from "./FileManagerContext";
import { useMutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DELETE_FILE, LIST_FILES, LIST_TAGS } from "./graphql";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/file-manager/file-details");

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "li-title": {
                children?: React.ReactNode;
            };

            "li-content": {
                children?: React.ReactNode;
            };
        }
    }
}

const style: any = {
    wrapper: css({
        padding: 10,
        height: "100%",
        overflow: "auto"
    }),
    header: css({
        fontSize: 18,
        textAlign: "center",
        padding: 10,
        fontWeight: 600,
        color: "var(--mdc-theme-on-surface)"
    }),
    preview: css({
        backgroundColor: "var(--mdc-theme-background)",
        padding: 10,
        position: "relative",
        width: 200,
        height: 200,
        margin: "0 auto",
        img: {
            maxHeight: 200,
            maxWidth: 200,
            width: "auto",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            backgroundColor: "#fff"
        }
    }),
    download: css({
        textAlign: "center",
        margin: "0 auto",
        width: "100%"
    }),
    list: css({
        textAlign: "left",
        color: "var(--mdc-theme-on-surface)",
        li: {
            padding: 10,
            lineHeight: "22px",
            "li-title": {
                fontWeight: 600,
                display: "block"
            },
            "li-content": {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                display: "block"
            }
        }
    })
};

export default function FileDetails(props) {
    const { file, uploadFile, validateFiles } = props;
    const filePlugin = getFileTypePlugin(file);
    const actions = get(filePlugin, "fileDetails.actions") || [];

    const { hideFileDetails, queryParams } = useFileManager();

    useHotkeys({
        zIndex: 55,
        disabled: !file,
        keys: {
            esc: hideFileDetails
        }
    });

    const [deleteFile] = useMutation(DELETE_FILE, {
        update: cache => {
            // 1. Update files list cache
            const data: any = cloneDeep(
                cache.readQuery({
                    query: LIST_FILES,
                    variables: queryParams
                })
            );
            const filteredList = data.fileManager.listFiles.data.filter(
                item => item.id !== file.id
            );

            cache.writeQuery({
                query: LIST_FILES,
                variables: queryParams,
                data: set(data, "fileManager.listFiles.data", filteredList)
            });
            // 2. Update "ListTags" cache
            const selectedFile = data.fileManager.listFiles.data.find(item => item.id === file.id);
            if (Array.isArray(selectedFile.tags)) {
                const tagCountMap = {};
                // Prepare "tag" count map
                data.fileManager.listFiles.data.forEach(file => {
                    if (!Array.isArray(file.tags)) {
                        return;
                    }
                    file.tags.forEach(tag => {
                        if (tagCountMap[tag]) {
                            tagCountMap[tag] += 1;
                        } else {
                            tagCountMap[tag] = 1;
                        }
                    });
                });

                // Get tags from cache
                const listTagsData: any = cloneDeep(
                    cache.readQuery({
                        query: LIST_TAGS
                    })
                );
                // Remove selected file tags from list.
                const filteredTags = listTagsData.fileManager.listTags.filter(tag => {
                    if (!selectedFile.tags.includes(tag)) {
                        return true;
                    }
                    return tagCountMap[tag] > 1;
                });

                // Write it to cache
                cache.writeQuery({
                    query: LIST_TAGS,
                    data: set(data, "fileManager.listTags", filteredTags)
                });
            }
        }
    });
    const { showSnackbar } = useSnackbar();

    const fileDeleteConfirmationProps = {
        title: t`Delete file`,
        message: file && (
            <span>
                {t`You're about to delete file {name}. Are you sure you want to continue?`({
                    name: file.name
                })}
            </span>
        )
    };

    return (
        <Drawer dir="rtl" modal open={file} onClose={hideFileDetails}>
            {file && (
                <div className={style.wrapper} dir="ltr">
                    <div className={style.header}>File details</div>
                    <div className={style.preview}>
                        {filePlugin.render({ file, uploadFile, validateFiles })}
                    </div>
                    <div className={style.download}>
                        <>
                            <Tooltip content={<span>{t`Download file`}</span>} placement={"bottom"}>
                                <IconButton
                                    onClick={() => window.open(file.src, "_blank")}
                                    icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />}
                                />
                            </Tooltip>

                            {actions.map((Component, index) => (
                                <Component key={index} {...props} />
                            ))}

                            <ConfirmationDialog
                                {...fileDeleteConfirmationProps}
                                data-testid={"fm-delete-file-confirmation-dialog"}
                                style={{ zIndex: 100 }}
                            >
                                {({ showConfirmation }) => {
                                    return (
                                        <Tooltip
                                            content={<span>{t`Delete image`}</span>}
                                            placement={"bottom"}
                                        >
                                            <IconButton
                                                data-testid={"fm-delete-file-button"}
                                                icon={
                                                    <DeleteIcon style={{ margin: "0 8px 0 0" }} />
                                                }
                                                onClick={() =>
                                                    showConfirmation(async () => {
                                                        await deleteFile({
                                                            variables: {
                                                                id: file.id
                                                            }
                                                        });
                                                        showSnackbar(t`File deleted successfully.`);
                                                    })
                                                }
                                            />
                                        </Tooltip>
                                    );
                                }}
                            </ConfirmationDialog>
                        </>
                    </div>
                    <DrawerContent dir="ltr">
                        <ul className={style.list}>
                            <li>
                                <li-title>{t`Name:`}</li-title>
                                <Name {...props} />
                            </li>
                            <li>
                                <li-title>{t`Size:`}</li-title>
                                <li-content>{bytes.format(file.size)}</li-content>
                            </li>
                            <li>
                                <li-title>{t`Type:`}</li-title>
                                <li-content>{file.type}</li-content>
                            </li>
                            <li>
                                <li-title>{t`Tags:`}</li-title>
                                <Tags key={props.file.id} {...props} />
                            </li>
                            <li>
                                <li-title>{t`Created:`}</li-title>
                                <li-content>
                                    <TimeAgo datetime={file.createdOn} />
                                </li-content>
                            </li>
                        </ul>
                    </DrawerContent>
                </div>
            )}
        </Drawer>
    );
}
