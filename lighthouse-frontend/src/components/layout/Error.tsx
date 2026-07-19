import PageState from './PageState';

interface ErrorProps {
  message: string;
}

const Error = ({ message }: ErrorProps) => {
  return (
    <PageState
      title="Something went off course"
      message={message}
      tone="error"
    />
  );
};

export default Error;
