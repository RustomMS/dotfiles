#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    // TODO Remove
    #[error("Coming soon! This feature is unimplemented")]
    Unimplemented,

    #[error("internal: {0}")]
    Internal(String),
}

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[allow(unused_macros)]
macro_rules! internal {
    ($($arg:tt)*) => {
        crate::errors::Error::Internal(std::format!($($arg)*))
    };
}
pub(crate) use internal;
