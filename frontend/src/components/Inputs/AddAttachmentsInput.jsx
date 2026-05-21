import TaskAttachmentsInput from "./TaskAttachmentsInput";

/** Project manager reference attachments (requirements, specs, repo links). */
const AddAttachmentsInput = (props) => (
  <TaskAttachmentsInput
    helperText="Reference materials for the team: requirement PDFs, main repo links, design docs, etc."
    {...props}
  />
);

export default AddAttachmentsInput;
