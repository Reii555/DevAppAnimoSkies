function applyFilters() {

    const selectedUser = $("#filterUsers").val();
    const selectedActivity = $("#filterActivity").val();

    console.log("user: ", selectedUser)
    console.log("activity: ", selectedActivity)

    $("#auditsTableBody tr").each(function () {

        const user = $(this).data("user");
        const activity = $(this).data("activity");

        const sameUser =
            selectedUser === "" || user === selectedUser;

        const sameActivity =
            selectedActivity === "" || activity === selectedActivity;

        if (sameUser && sameActivity) {
            $(this).show();
        } else {
            $(this).hide();
        }

    });

}

$("#filterUsers").change(applyFilters);
$("#filterActivity").change(applyFilters);
