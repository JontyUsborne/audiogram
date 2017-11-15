var transports = require("../lib/transports");

function getList(req, res) {

	var email = req.header('BBC_IDOK') ? req.header('BBC_EMAIL') : 'null';

	transports.getProjectList(function(err, projects){

		if (err) return res.json({err: err});
		var list = [],
			now = (new Date()).getTime();
		for (var i = 0; i < projects.length; i++) {
			// Only return this user's projects
			if (projects[i].user==email) {
				var id = projects[i].id,
					audioId = projects[i].media.audio.path.split(path.sep).reverse()[1],
					user = projects[i].user,
					date = +projects[i].created,
					duration = +projects[i].duration;
				// Don't returned expired projects (>3 days)
				var diffDays = Math.round(Math.abs((now - date)/(24*60*60*1000)));
				console.log(now + " - " + date + " - " + diffDays);
				if (diffDays < 5) {
					list.push({ id: id, audioId: audioId, user: user, date: date, duration: duration });
				}
			}
		}
		return res.json(list);

	});

}

function getProject(req, res) {

	var project = {err: "No project found matching that ID."};
	transports.getProjectList(function(err, projects){

		if (err) return res.json({err: err});
		for (var i = 0; i < projects.length; i++) {
			if (projects[i].id==req.params.id) {
				project = projects[i];
				break;
			}
		}
		return res.json(project);

	});
}

module.exports = {
  getList: getList,
  getProject: getProject
};