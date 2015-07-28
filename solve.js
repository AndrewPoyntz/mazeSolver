/**
 * Created by Andrew on 25/07/2015.
 */
var maze = {
	getMaze: function () {
		$.ajax({
			url: 'realMaze.json',
			async:false,
			success: function (data) {
				maze.data = data;
				maze.draw();
			}
		})
	},
	data: null,
	draw: function () {
		var i, j, row, cell, div = $('#maze'), table = $('<table>'), tr, td;
		for (i = 0; i < maze.data.length; i++) {
			tr = $('<tr>');
			row = maze.data[i];
			for (j = 0; j < row.length; j++) {
				td = $('<td>');
				cell = row[j];
				if (cell.wall) {
					td.addClass('wall');
				}
				if (cell.visited) {
					td.addClass('visited');
				}
				if (cell.bestRoute){
					td.addClass('best');
				}
				tr.append(td);
			}
			table.append(tr);
		}
		div.html(table);
	},
	startPoint: null,
	currentPosition:null,
	currentOrder:0,
	moveCounter:0,
	stuckCount:0,
	mazeSolved:false,
	stuck:false,
	findStartPoint: function () {
		var i, j, row, cell;
		for (i = 0; i < maze.data.length; i++) {
			row = maze.data[i];
			for (j = 0; j < row.length; j++) {
				cell = row[j];
				if (cell.startPoint) {
					cell.visited = true;
					cell.order = maze.currentOrder;
					maze.currentOrder += 1;
					maze.startPoint = {row:i, column:j};
					return maze.startPoint;
				}
			}
		}
	},
	getOptions:function () {
		var options = [], cr = maze.currentPosition.row, cc = maze.currentPosition.column,
			above = (cr - 1 >= 0) ? maze.data[cr-1][cc] : null,
			below = (cr + 1 <= maze.data.length) ? maze.data[cr + 1][cc] : null,
			left = (cc - 1 >= 0) ?maze.data[cr][cc - 1] : null,
			right = (cc + 1 <= maze.data[0].length) ? maze.data[cr][cc + 1] : null;

		if (cr > 0 && above && !above.visited && !above.wall){
			options.push({row:cr-1, column:cc});
		}
		if (cr < maze.data.length && below && !below.visited && !below.wall){
			options.push({row:cr+1, column:cc});
		}
		if (cc > 0 && right &&!right.visited && !right.wall){
			options.push({row:cr, column:cc + 1});
		}
		if (cc < maze.data[0].length && left && !left.visited && !left.wall){
			options.push({row:cr, column:cc - 1});
		}
		if (above && above.exitPoint){
			options = [{row:cr-1, column:cc}];
			maze.mazeSolved = true;
		}
		if (below && below.exitPoint){
			options = [{row:cr+1, column:cc}];
			maze.mazeSolved = true;
		}
		if (left && left.exitPoint){
			options = [{row:cr, column:cc-1}];
			maze.mazeSolved = true;
		}
		if (right && right.exitPoint){
			options = [{row:cr, column:cc+1}];
			maze.mazeSolved = true;
		}
		return options;
	},
	getLastSpace:function () {
		maze.history.pop();
		//console.log(maze.history[maze.history.length-1]);
		return maze.history[maze.history.length-1];
	},
	goBackASpace: function (){
		maze.currentPosition = maze.getLastSpace();;
	},
	history:[],
	movePosition:function () {
		var nextPosition,
			options = maze.getOptions();
		if (options.length >= 1){
			nextPosition = Math.floor(Math.random() * options.length);
			maze.history.push(options[nextPosition]);
			maze.stuckCount = 0;
			maze.move(options[nextPosition]);
		} else {
			maze.stuckCount++;
			if (maze.stuckCount < 50) { // if it takes more than 50 moves to find a space with options, we're too stuck :(
				//console.log('stuck :( going back 1 space & trying again');
				maze.goBackASpace();
				maze.movePosition();
			} else {
				//console.log('too stuck, giving up :(');
				maze.stuck = true;
			}
		}
	},
	move:function(position) {
		var newDataPosition = maze.data[position.row][position.column];
		maze.currentPosition = {row:position.row, column:position.column};
		newDataPosition.visited = true;
		maze.currentOrder++;
		newDataPosition.order = maze.currentOrder;
		maze.draw();
	},
	solve: function () {
		maze.movePosition();
		$('#info').html('Moving, turn ' + maze.moveCounter);

		if (maze.mazeSolved){
			maze.showBestRoute();
			$('#info').html('SOLVED!!');
		}
		if (maze.stuck){
			$('#info').html('stuck, giving up :(');
		}
		if (maze.moveCounter < 10000 && !maze.mazeSolved && !maze.stuck){
			maze.moveCounter++;
			window.setTimeout(maze.solve, 30);
		}
	},
	showBestRoute: function (){
		var i, move, cell;
		maze.data[maze.startPoint.row][maze.startPoint.column].bestRoute = true;
		for (i=0; i < maze.history.length; i++){
			move = maze.history[i];
			cell = maze.data[move.row][move.column];
			cell.bestRoute = true;
		}
		maze.draw();
	}
};

$(document).ready(function () {
	var startPoint;
	maze.getMaze();
	startPoint = (maze.startPoint === null) ? maze.findStartPoint() : maze.startPoint;
	maze.currentPosition = startPoint;
	maze.solve();
});