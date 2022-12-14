#[derive(Debug, thiserror::Error)]
pub enum Error {
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
