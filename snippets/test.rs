/// Utility module for creating object store cache for testing
#[cfg(test)]
pub mod test_util {
    use super::*;
    use tempfile::TempDir;

    pub fn new_object_cache() -> () {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn async_test() {
        todo!()
    }

    #[test]
    fn sync_test() {
        todo!()
    }
}
