{viewMode !== 'thumbnail' && totalPages > 1 && (
  <div className="pagination-container">
    <Pagination 
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  </div>
)} 