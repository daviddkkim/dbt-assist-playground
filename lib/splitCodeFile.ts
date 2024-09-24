export const getCodeAboveAndBelow = (editor: any, startLine: number, endLine: number) => {
    const model = editor.getModel();
    const totalLines = model.getLineCount();

    // Get the entire text
    const fullText = model.getValue();
    // Get the text above the specified line
    const prefix = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: startLine - 1,
        endColumn: model.getLineMaxColumn(startLine - 1)
    });

    // Get the text below the specified line
    const suffix = model.getValueInRange({
        startLineNumber: endLine + 1,
        startColumn: 1,
        endLineNumber: totalLines,
        endColumn: model.getLineMaxColumn(totalLines)
    });

    return { prefix, suffix };
};