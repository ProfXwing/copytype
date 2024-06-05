use serde::Serialize;

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error("no file selected")]
  NoFileSelected,
  #[error("unknown file type")]
  UnknownFileType,
}

#[derive(Serialize)]
struct ErrorData {
  message: String,
  code: u16,
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    let message = self.to_string();
    let code = match self {
      Error::Io(_) => 0,
      Error::NoFileSelected => 1,
      Error::UnknownFileType => 2,
    };

    let error_data = ErrorData { message, code };
    error_data.serialize(serializer)
  }
}