$(document).ready(function() {

    let currentPage = 1;
    const rowsPerPage = 5;
    let filteredUsers = [];
    let totalUsers = 0;
    let currentFilter = 'all';
    let currentSort = 'id';
    let currentSearch = '';

    // Function to load users from server via AJAX
    function loadUsers() {
        // Show loading state
        const tbody = $('#usersTableBody');
        tbody.html(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading users...</p>
                </td>
            </tr>
        `);

        // Make AJAX request
        $.ajax({
            url: '/admin-users/api',
            method: 'GET',
            data: {
                page: currentPage,
                limit: rowsPerPage,
                filter: currentFilter,
                sort: currentSort,
                search: currentSearch
            },
            success: function(response) {
                // Store le  data
                filteredUsers = response.users || [];
                totalUsers = response.total || 0;
                
                // Populate the table
                populateUserTable();
                
                console.log(`Loaded ${filteredUsers.length} users (Total: ${totalUsers})`);
            },
            error: function(xhr) {
                console.error('Error loading users:', xhr);
                tbody.html(`
                    <tr>
                        <td colspan="8" class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            Failed to load users. Please try again.
                            <br>
                            <button class="btn btn-outline-primary btn-sm mt-2" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Retry
                            </button>
                        </td>
                    </tr>
                `);
            }
        });
    }

    function populateUserTable() {
        const tbody = $('#usersTableBody');
        
        if (filteredUsers.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-inbox me-2"></i>
                        No users found matching your criteria.
                    </td>
                </tr>
            `);
            updatePaginationInfo();
            return;
        }

        let rows = '';
        filteredUsers.forEach(user => {
            // Status badge
            const statusBadge = user.status === 'active' 
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-danger">Deleted</span>';
            
            // Role badge
            const roleBadge = user.role === 'admin'
                ? '<span class="badge bg-primary">Admin</span>'
                : '<span class="badge bg-secondary">Customer</span>';

            // Format dates
            const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'N/A';
            
            const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Never';

            rows += `
                <tr data-id="${user.id}">
                    <td><strong>${user.id}</strong></td>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${createdDate}</td>
                    <td>${lastLoginDate}</td>
                    <td>${statusBadge}</td>
                    <td>${roleBadge}</td>
                </tr>
            `;
        });

        tbody.html(rows);
        updatePaginationInfo();
    }

    function updatePaginationInfo() {
        const total = totalUsers;
        const totalPages = Math.ceil(total / rowsPerPage) || 1;
        const start = total > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0;
        const end = Math.min(currentPage * rowsPerPage, total);

        // Update pagination info
        if (total === 0) {
            $('#paginationInfo').text('Showing 0 users');
        } else {
            $('#paginationInfo').text(`Showing ${start} to ${end} of ${total} users`);
        }
        
        $('#currentPage').text(currentPage);
        $('#previousPage').prop('disabled', currentPage <= 1);
        $('#nextPage').prop('disabled', currentPage >= totalPages);
    }

    // Filter/Search/Sort functions
    function applyFilters() {
        currentSearch = $('#searchUsers').val().trim();
        currentFilter = $('#filterUsers').val();
        currentSort = $('#sortUsers').val();
        currentPage = 1; // Reset to first page
        
        loadUsers();
    }

    // Event Handlers

    // Search with debounce
    let searchTimeout;
    $('#searchUsers').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300);
    });

    // Filter dropdown
    $('#filterUsers').on('change', function() {
        applyFilters();
    });

    // Sort dropdown
    $('#sortUsers').on('change', function() {
        applyFilters();
    });

    // Previous page
    $('#previousPage').click(function() {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });

    // Next page
    $('#nextPage').click(function() {
        const totalPages = Math.ceil(totalUsers / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    });

    // Initial load
    loadUsers();
});