import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useStoryStore } from '../store/storyStore';
import { useEffect } from 'react';
import './StoryEditor.css';

interface StoryEditorProps {
    className?: string;
}

export const StoryEditor = ({ className }: StoryEditorProps) => {
    const {
        currentStory,
        updateStoryContent,
        setEditorFocus
    } = useStoryStore();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing your story here... Let your imagination flow!',
                emptyEditorClass: 'is-editor-empty',
            }),
            CharacterCount.configure({
                limit: 100000, // 100k character limit
            }),
        ],
        content: currentStory?.content || '',
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            updateStoryContent(content);
        },
        onFocus: () => setEditorFocus(true),
        onBlur: () => setEditorFocus(false),
        editorProps: {
            attributes: {
                class: 'story-editor-content',
            },
        },
    });

    // Update editor content when current story changes
    useEffect(() => {
        if (editor && currentStory) {
            const currentContent = editor.getHTML();
            const newContent = currentStory.content || '';

            if (currentContent !== newContent) {
                editor.commands.setContent(newContent);
            }
        }
    }, [editor, currentStory]);

    if (!editor) {
        return (
            <div className="editor-loading" role="status" aria-live="polite">
                <span>Loading editor...</span>
                <div className="loading-spinner" aria-hidden="true"></div>
            </div>
        );
    }

    return (
        <div className={`story-editor ${className || ''}`}>
            <div className="editor-toolbar" role="toolbar" aria-label="Text formatting options">
                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'is-active' : ''}
                        title="Bold (Ctrl+B)"
                        aria-label="Bold"
                        aria-pressed={editor.isActive('bold')}
                        type="button"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'is-active' : ''}
                        title="Italic (Ctrl+I)"
                        aria-label="Italic"
                        aria-pressed={editor.isActive('italic')}
                        type="button"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={editor.isActive('strike') ? 'is-active' : ''}
                        title="Strikethrough"
                        aria-label="Strikethrough"
                        aria-pressed={editor.isActive('strike')}
                        type="button"
                    >
                        <s>S</s>
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                        title="Heading 1"
                        aria-label="Heading 1"
                        aria-pressed={editor.isActive('heading', { level: 1 })}
                        type="button"
                    >
                        H1
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                        title="Heading 2"
                        aria-label="Heading 2"
                        aria-pressed={editor.isActive('heading', { level: 2 })}
                        type="button"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                        title="Heading 3"
                        aria-label="Heading 3"
                        aria-pressed={editor.isActive('heading', { level: 3 })}
                        type="button"
                    >
                        H3
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'is-active' : ''}
                        title="Bullet List"
                    >
                        • List
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'is-active' : ''}
                        title="Numbered List"
                    >
                        1. List
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={editor.isActive('blockquote') ? 'is-active' : ''}
                        title="Quote"
                    >
                        "Quote"
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        ―
                    </button>
                </div>

                <div className="toolbar-stats">
                    <span className="word-count">
                        {currentStory?.wordCount || 0} words
                    </span>
                    <span className="char-count">
                        {editor.storage.characterCount.characters()}/100,000 characters
                    </span>
                </div>
            </div>

            <div className="editor-container">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
