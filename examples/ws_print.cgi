#!/usr/bin/perl

use 5.014;
use strict;

use autodie qw(:all);
use Carp;
use Data::Dumper;
use Tie::Scalar::Timestamp;

use Net::WebSocket::Server;

tie my $timestamp, 'Tie::Scalar::Timestamp';

my $port = 3030;

print "Starting WebSocket printer server\n";
print "Listening on port $port\n\n";

Net::WebSocket::Server->new(
    listen => 3030,
    on_connect => sub {
        my ($serv, $conn) = @_;
        $conn->on(
            handshake => sub {
                my ( $conn, $hs ) = @_;
                my $fields = $conn->{ 'handshake' }{'req'}{'fields'};
                print "$timestamp handshake " . $fields->{'user-agent'} . "\n";
                print Dumper( );
            },
            ready => sub {
                my ($conn) = @_;
                print "$timestamp ready\n";
                $conn->send_binary("ready");
            },
            utf8 => sub {
                my ( $conn, $msg ) = @_;
                print "$timestamp utf8: $msg\n";
                $conn->send_utf8( "utf8(" . length($msg) . ") = $msg" );
            },
            binary => sub {
                my ( $conn, $msg ) = @_;
                print "$timestamp binary: $msg\n";
                $conn->send_binary( "binary(" . length($msg) . ") = $msg" );
            },
            pong => sub {
                my ( $conn, $msg ) = @_;
                print "$timestamp pong: $msg\n";
                $conn->send_binary( "pong(" . length($msg) . ") = $msg" );
            },
            disconnect => sub {
                my ( $conn, $code, $reason ) = @_;
                print "$timestamp disconnect\n";
            },
        );

    },
)->start;
