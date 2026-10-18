import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    name: string;
    defaultValue: string;
    invalid?: boolean;
};

type ToolbarAction = {
    label: string;
    icon: LucideIcon;
    isActive: (editor: Editor) => boolean;
    run: (editor: Editor) => void;
};

const toolbarActions: ToolbarAction[] = [
    {
        label: 'Bold',
        icon: Bold,
        isActive: (editor) => editor.isActive('bold'),
        run: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
        label: 'Italic',
        icon: Italic,
        isActive: (editor) => editor.isActive('italic'),
        run: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
        label: 'Link',
        icon: Link2,
        isActive: (editor) => editor.isActive('link'),
        run: (editor) => {
            if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();

                return;
            }

            const href = window.prompt('Link address');

            if (href) {
                editor
                    .chain()
                    .focus()
                    .extendMarkRange('link')
                    .setLink({ href })
                    .run();
            }
        },
    },
    {
        label: 'Bulleted list',
        icon: List,
        isActive: (editor) => editor.isActive('bulletList'),
        run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        label: 'Numbered list',
        icon: ListOrdered,
        isActive: (editor) => editor.isActive('orderedList'),
        run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        label: 'Quote',
        icon: Quote,
        isActive: (editor) => editor.isActive('blockquote'),
        run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
];

export function RichTextEditor({ id, name, defaultValue, invalid }: Props) {
    const [html, setHtml] = useState(defaultValue);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                code: false,
                codeBlock: false,
                horizontalRule: false,
                strike: false,
                underline: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                },
            }),
        ],
        content: defaultValue,
        shouldRerenderOnTransaction: true,
        editorProps: {
            attributes: {
                id,
                'aria-label': 'What happened',
                class: 'rich-text min-h-36 px-3 py-2 text-base outline-none md:text-sm',
            },
        },
        onUpdate: ({ editor }) =>
            setHtml(editor.isEmpty ? '' : editor.getHTML()),
    });

    return (
        <div
            aria-invalid={invalid}
            className={cn(
                'rounded-md border border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
            )}
        >
            <div className="flex gap-0.5 border-b border-input p-1">
                {toolbarActions.map((action) => (
                    <Toggle
                        key={action.label}
                        size="sm"
                        aria-label={action.label}
                        title={action.label}
                        pressed={editor ? action.isActive(editor) : false}
                        onPressedChange={() => editor && action.run(editor)}
                    >
                        <action.icon />
                    </Toggle>
                ))}
            </div>
            <EditorContent editor={editor} />
            <input type="hidden" name={name} value={html} />
        </div>
    );
}
