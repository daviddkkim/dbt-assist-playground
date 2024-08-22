const PromptItem = ({ context, message }: { context: string[], message: string }) => {
    return <div
        className="border rounded-md p-3 flex">
        <div className="flex flex-col gap-2">
            {context.map((c, i) => <pre key={i} className="border rounded-md p-2 text-xs bg-secondary/50">{c}</pre>)}
            <p>{message}</p>

        </div>
    </div>;
};

export default PromptItem;