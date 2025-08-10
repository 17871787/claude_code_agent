# ops_launcher_client
Objective: Run the AM bundle end-to-end.

Run in order:
1) context_distiller_client
2) daily_heartbeat
3) meeting_prep
4) (optional) inbound_triage if inbound_raw file exists
5) If Friday: weekly_status; else skip
Then print only the created/updated file paths.